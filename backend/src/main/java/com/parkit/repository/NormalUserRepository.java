package com.parkit.repository;

import com.parkit.domain.model.NormalUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NormalUserRepository extends JpaRepository<NormalUser, String> {

    Optional<NormalUser> findByEmail(String email);

    Optional<NormalUser> findByUsername(String username);
}
