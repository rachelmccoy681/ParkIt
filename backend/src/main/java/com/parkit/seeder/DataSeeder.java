package com.parkit.seeder;

import com.parkit.domain.factory.ParkingSpotFactory;
import com.parkit.domain.model.Admin;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingLot;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.repository.AdminRepository;
import com.parkit.repository.ParkingLotRepository;
import com.parkit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements ApplicationRunner {

    private final ParkingLotRepository lotRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SEED_ADMIN_PASSWORD}")
    private String adminPassword;

    @Value("${SEED_ANDREW_PASSWORD}")
    private String andrewPassword;

    public DataSeeder(ParkingLotRepository lotRepository,
                      UserRepository userRepository,
                      AdminRepository adminRepository,
                      PasswordEncoder passwordEncoder) {
        this.lotRepository = lotRepository;
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdmin();
        seedParkingData();
    }

    private void seedAdmin() {
        seedAdminAccount("admin@parkit.com", adminPassword, "Admin");
        seedAdminAccount("andli20140@gmail.com", andrewPassword, "Andrew");
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
}
