package com.staysafe.service;

import com.staysafe.model.Notification;
import com.staysafe.model.Role;
import com.staysafe.model.User;
import com.staysafe.repo.NotificationRepository;
import com.staysafe.repo.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationRepository repo;
    private final UserRepository users;

    public NotificationService(NotificationRepository repo, UserRepository users) {
        this.repo = repo;
        this.users = users;
    }

    public void notify(User user, String title, String message, String type) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        repo.save(n);
    }

    public void notifyRole(Role role, String title, String message, String type) {
        users.findByRole(role).forEach(u -> notify(u, title, message, type));
    }
}
