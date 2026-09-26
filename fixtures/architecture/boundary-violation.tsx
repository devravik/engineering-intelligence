'use client';

import React from 'react';

export default function UserListClient() {
  const loadUsers = async () => {
    // Direct database query in client component
    await db.user.findMany();
  };

  return <div>Users</div>;
}
