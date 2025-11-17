// patterns/TourService.js

// Interface Component (Base Class)
class ITourService {
  async getAllTours(query) { throw new Error('Method not implemented'); }
  async getTourById(id) { throw new Error('Method not implemented'); }
  async createTour(data) { throw new Error('Method not implemented'); }
  async updateTour(id, data) { throw new Error('Method not implemented'); }
  async deleteTour(id) { throw new Error('Method not implemented'); }
}

// Concrete Component (Lớp thực hiện logic chính)
class TourService extends ITourService {
  constructor(TourModel) {
    super();
    this.Tour = TourModel;
  }

  async getAllTours(query) {
    // Logic tìm kiếm/lọc (đơn giản hóa)
    return this.Tour.find(query).populate('category');
  }

  async getTourById(id) {
    return this.Tour.findById(id).populate('category');
  }

  async createTour(data) {
    
    if (data.images && data.images.length > 5) {
        throw new Error('Tour chỉ có thể có tối đa 5 ảnh phụ.');
    }
    
    
    if (!data.imageCover) {
         throw new Error('Tour cần có một ảnh bìa (imageCover).');
    }

  return this.Tour.create(data);
 }

  async updateTour(id, data) {
    if (data.images && data.images.length > 5) {
        throw new Error('Tour chỉ có thể có tối đa 5 ảnh phụ.');
    }


    return this.Tour.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteTour(id) {
    return this.Tour.findByIdAndDelete(id);
  }
}

// Lớp cơ sở cho Decorator (Base Decorator)
class TourServiceDecorator extends ITourService {
  constructor(tourService) {
    super();
    this.tourService = tourService;
  }
  
  // Chuyển tiếp tất cả các phương thức đến lớp bọc
  async getAllTours(query) {
    return this.tourService.getAllTours(query);
  }
  async getTourById(id) {
    return this.tourService.getTourById(id);
  }
  async createTour(data) {
    return this.tourService.createTour(data);
  }
  async updateTour(id, data) {
    return this.tourService.updateTour(id, data);
  }
  async deleteTour(id) {
    return this.tourService.deleteTour(id);
  }
}

module.exports = { TourService, TourServiceDecorator };