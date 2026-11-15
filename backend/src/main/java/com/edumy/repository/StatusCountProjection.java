package com.edumy.repository;

import com.edumy.entity.UserStatus;

public interface StatusCountProjection {
    UserStatus getStatus();
    Long getCount();
}
