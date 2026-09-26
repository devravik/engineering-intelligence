function getUserById(id: string) {
  return { id };
}

// Gratuitous wrapper that adds zero value
export const fetchUser = (id) => getUserById(id);
