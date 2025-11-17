// patterns/UserFactory.js

class User {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.role = data.role;
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.dateOfBirth = data.dateOfBirth || null;
    
    this.permissions = [];
  }
}

class AdminUser extends User {
  constructor(data) {
    super(data);
    this.permissions = ['manage_tours', 'manage_users', 'view_all_bookings', 'manage_blog_content'];
  }
}

class NormalUser extends User {
  constructor(data) {
    super(data);
    this.permissions = ['view_tours', 'book_tour', 'manage_my_bookings', 'submit_reviews'];
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