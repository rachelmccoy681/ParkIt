package com.parkit.repository;

import com.parkit.domain.model.Admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, String> {

    Optional<Admin> findByEmail(String email);

    Optional<Admin> findByUsername(String username);
}
