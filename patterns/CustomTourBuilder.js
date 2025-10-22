// patterns/CustomTourBuilder.js

// 1. Sản phẩm (Product): Đại diện cho Tour Tùy Chỉnh
class CustomTour {
  constructor() {
    this.name = 'Custom Tour';
    this.components = {};
  }

  // Thêm thành phần vào tour
  addComponent(key, value) {
    this.components[key] = value;
  }

  // Phương thức tính toán tổng giá (Đơn giản hóa)
  calculatePrice() {
    let basePrice = 500; // Giá khởi điểm
    
    // Ví dụ tính giá dựa trên các thành phần
    if (this.components.transportation === 'Plane') {
      basePrice += 1000;
    }
    if (this.components.accommodation === 'Luxury Hotel') {
      basePrice += 800;
    }
    if (this.components.activities && this.components.activities.length > 2) {
        basePrice += 300;
    }
    return basePrice;
  }
  
  getDetails() {
    return {
      name: this.name,
      ...this.components,
      estimatedPrice: this.calculatePrice()
    };
  }
}

// 2. Builder Interface (Base Builder)
class ITourBuilder {
  setDestination(destination) { throw new Error('Method not implemented'); }
  setDuration(days) { throw new Error('Method not implemented'); }
  setTransportation(transportation) { throw new Error('Method not implemented'); }
  setAccommodation(type) { throw new Error('Method not implemented'); }
  addActivity(activity) { throw new Error('Method not implemented'); }
  build() { throw new Error('Method not implemented'); }
}


// 3. Concrete Builder: Triển khai các bước xây dựng
class ConcreteCustomTourBuilder extends ITourBuilder {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.tour = new CustomTour();
  }

  setDestination(destination) {
    this.tour.addComponent('destination', destination);
    return this;
  }

  setDuration(days) {
    this.tour.addComponent('durationDays', days);
    return this;
  }

  setTransportation(transportation) {
    this.tour.addComponent('transportation', transportation);
    return this;
  }

  setAccommodation(type) {
    this.tour.addComponent('accommodation', type);
    return this;
  }

  addActivity(activity) {
    if (!this.tour.components.activities) {
      this.tour.components.activities = [];
    }
    this.tour.components.activities.push(activity);
    return this;
  }
  
  // Trả về đối tượng Tour đã hoàn thành
  build() {
    const finalTour = this.tour.getDetails();
    this.reset(); // Đặt lại builder để sẵn sàng cho tour tiếp theo
    return finalTour;
  }
}

// 4. Director (Tùy chọn): Quản lý trình tự xây dựng các cấu hình phổ biến
class CustomTourDirector {
    constructAdventureTour(builder) {
        return builder
            .setDestination("Nepal")
            .setDuration(10)
            .setTransportation("Plane")
            .setAccommodation("Tented Camp")
            .addActivity("Trekking")
            .addActivity("Rock Climbing")
            .build();
    }

    constructLuxuryTour(builder) {
        return builder
            .setDestination("Paris")
            .setDuration(7)
            .setTransportation("Plane")
            .setAccommodation("Luxury Hotel")
            .addActivity("Fine Dining")
            .build();
    }
}

module.exports = {
  ConcreteCustomTourBuilder,
  CustomTourDirector
};