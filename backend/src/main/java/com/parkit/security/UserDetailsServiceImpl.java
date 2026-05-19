package com.parkit.security;

import com.parkit.domain.model.Admin;
import com.parkit.domain.model.User;
import com.parkit.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No user with username: " + username));

        String role = user instanceof Admin ? "ROLE_ADMIN" : "ROLE_USER";

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUserID())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority(role)))
                .accountLocked(!user.isEmailVerified())
                .disabled(!user.isActive())
                .build();
    }
}
