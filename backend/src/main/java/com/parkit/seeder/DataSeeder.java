package com.parkit.seeder;

import com.parkit.domain.factory.ParkingSpotFactory;
import com.parkit.domain.model.Admin;
import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.OccupancySnapshot;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingLot;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.repository.AdminRepository;
import com.parkit.repository.NormalUserRepository;
import com.parkit.repository.OccupancySnapshotRepository;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingLotRepository;
import com.parkit.repository.UserRepository;
import com.parkit.service.PredictionService;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final ParkingLotRepository lotRepository;
    private final ParkingFloorRepository floorRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final NormalUserRepository normalUserRepository;
    private final OccupancySnapshotRepository snapshotRepository;
    private final PredictionService predictionService;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random(42);

    @Value("${SEED_ADMIN_PASSWORD}")
    private String adminPassword;

    @Value("${SEED_ANDREW_PASSWORD}")
    private String andrewPassword;

    @Value("${SEED_TEST_PASSWORD}")
    private String testPassword;

    @Value("${app.seed.occupancy:true}")
    private boolean seedOccupancy;

    public DataSeeder(ParkingLotRepository lotRepository,
                      ParkingFloorRepository floorRepository,
                      UserRepository userRepository,
                      AdminRepository adminRepository,
                      NormalUserRepository normalUserRepository,
                      OccupancySnapshotRepository snapshotRepository,
                      PredictionService predictionService,
                      PasswordEncoder passwordEncoder) {
        this.lotRepository = lotRepository;
        this.floorRepository = floorRepository;
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.normalUserRepository = normalUserRepository;
        this.snapshotRepository = snapshotRepository;
        this.predictionService = predictionService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("DataSeeder starting (seedOccupancy={})", seedOccupancy);
        seedAdmin();
        seedTestDriver();
        seedParkingData();
        if (seedOccupancy) {
            seedOccupancyHistory();
        } else {
            log.info("Occupancy seeding skipped (seedOccupancy=false)");
        }
        predictionService.scheduledRegeneration();
        log.info("DataSeeder complete");
    }

    private void seedAdmin() {
        seedAdminAccount("admin@parkit.com", adminPassword, "Admin");
        seedAdminAccount("andli20140@gmail.com", andrewPassword, "Andrew");
    }

    private void seedTestDriver() {
        if (userRepository.existsByEmail("testdriver@parkit.com")) return;
        NormalUser user = new NormalUser("testdriver@parkit.com", passwordEncoder.encode(testPassword), "testdriver");
        user.setEmailVerified(true);
        normalUserRepository.save(user);
    }

    private void seedAdminAccount(String email, String password, String username) {
        userRepository.findByEmail(email).ifPresentOrElse(
            existing -> {
                if (!existing.isEmailVerified()) {
                    existing.setEmailVerified(true);
                    userRepository.save(existing);
                }
            },
            () -> {
                Admin admin = new Admin(email, passwordEncoder.encode(password), username);
                admin.setEmailVerified(true);
                adminRepository.save(admin);
            }
        );
    }

    private void seedParkingData() {
        if (lotRepository.count() > 0) return;

        ParkingLot lot = new ParkingLot("Central Parking", "1 George St, Sydney NSW 2000");

        ParkingFloor floorA = new ParkingFloor("Floor A", 10);
        addSpots(floorA, ParkingSpot.SpotTypeEnum.STANDARD, 5, 4.00);
        addSpots(floorA, ParkingSpot.SpotTypeEnum.EV, 3, 6.00);
        addSpots(floorA, ParkingSpot.SpotTypeEnum.DISABLED, 2, 2.00);

        ParkingFloor floorB = new ParkingFloor("Floor B", 8);
        addSpots(floorB, ParkingSpot.SpotTypeEnum.STANDARD, 5, 4.00);
        addSpots(floorB, ParkingSpot.SpotTypeEnum.EV, 2, 6.00);
        addSpots(floorB, ParkingSpot.SpotTypeEnum.DISABLED, 1, 2.00);

        lot.addFloor(floorA);
        lot.addFloor(floorB);
        lotRepository.save(lot);
    }

    private void addSpots(ParkingFloor floor, ParkingSpot.SpotTypeEnum type, int count, double rate) {
        for (int i = 0; i < count; i++) {
            floor.addSpot(ParkingSpotFactory.createSpot(type, floor, rate));
        }
    }

    // Seeds 365 days of hourly occupancy snapshots per floor.
    // Patterns are realistic for a CBD car park: strong morning peak 8-10am,
    // gradual afternoon decline, weekends shift to midday plateau. ±17% random noise per slot.
    private void seedOccupancyHistory() {
        long existing = snapshotRepository.count();
        log.info("Occupancy snapshot count before seeding: {}", existing);
        if (existing > 0) {
            log.info("Occupancy snapshots already exist, skipping");
            return;
        }

        List<ParkingFloor> floors = floorRepository.findAll();
        log.info("Found {} floors for occupancy seeding", floors.size());
        if (floors.isEmpty()) return;

        Instant now = Instant.now().truncatedTo(ChronoUnit.HOURS);
        List<OccupancySnapshot> batch = new ArrayList<>();

        for (int daysAgo = 365; daysAgo >= 1; daysAgo--) {
            Instant dayStart = now.minus(daysAgo, ChronoUnit.DAYS);
            DayOfWeek dow = dayStart.atZone(ZoneOffset.UTC).getDayOfWeek();

            for (int hour = 0; hour < 24; hour++) {
                Instant capturedAt = dayStart.plus(hour, ChronoUnit.HOURS);

                for (ParkingFloor floor : floors) {
                    double base = baseOccupancyRate(dow, hour);
                    double noise = (random.nextDouble() - 0.5) * 0.35;
                    double rate = Math.max(0.0, Math.min(1.0, base + noise));

                    int capacity = floor.getCapacity();
                    int occupied = (int) Math.round(rate * capacity);
                    int available = capacity - occupied;

                    batch.add(new OccupancySnapshot(
                            floor, occupied, 0, available, capacity, dow, hour, capturedAt));
                }
            }
        }

        log.info("Inserting {} occupancy snapshots...", batch.size());
        snapshotRepository.saveAll(batch);
        log.info("Occupancy snapshot seeding complete");
    }

    // Base occupancy rate by day of week and hour of day.
    // Weekdays: strong morning peak 8-10am, gradual afternoon decline, quiet evenings.
    // Weekends: slow morning build, midday leisure plateau, quiet evenings.
    private double baseOccupancyRate(DayOfWeek dow, int hour) {
        boolean weekend = dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
        if (weekend) {
            if (hour < 8)  return 0.05;
            if (hour < 10) return 0.20;
            if (hour < 12) return 0.40;
            if (hour < 18) return 0.55;
            if (hour < 20) return 0.30;
            return 0.10;
        } else {
            if (hour < 6)  return 0.05;
            if (hour < 8)  return 0.40;
            if (hour < 10) return 0.90;
            if (hour < 12) return 0.85;
            if (hour < 14) return 0.80;
            if (hour < 17) return 0.75;
            if (hour < 19) return 0.55;
            if (hour < 21) return 0.30;
            return 0.10;
        }
    }
}
