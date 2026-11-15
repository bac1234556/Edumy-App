package com.edumy.repository;

import com.edumy.entity.Role;

public interface RoleCountProjection {
    Role getRole();
    Long getCount();
}
