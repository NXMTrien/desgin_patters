// patterns/UserFactory.js

class User {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.role = data.role;
    this.permissions = [];
  }
}

class AdminUser extends User {
  constructor(data) {
    super(data);
    this.permissions = ['manage_tours', 'manage_users', 'view_all_bookings'];
  }
}

class NormalUser extends User {
  constructor(data) {
    super(data);
    this.permissions = ['view_tours', 'book_tour', 'manage_my_bookings'];
  }
}

class UserFactory {
  createUser(data) {
    if (data.role === 'admin') {
      return new AdminUser(data);
    } else if (data.role === 'user') {
      return new NormalUser(data);
    } else {
      throw new Error('Invalid user role provided.');
    }
  }
}

module.exports = new UserFactory();