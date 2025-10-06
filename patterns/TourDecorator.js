// patterns/TourDecorator.js
const { TourServiceDecorator } = require('./TourService');

// Concrete Decorator 1: Thêm chức năng Logging
class TourServiceWithLogging extends TourServiceDecorator {
  constructor(tourService) {
    super(tourService);
  }

  async getAllTours(query) {
    console.log(`[LOG - TourService] Fetching all tours with query: ${JSON.stringify(query)}`);
    return this.tourService.getAllTours(query);
  }

  async createTour(data) {
    console.log(`[LOG - TourService] Attempting to create new tour: ${data.title}`);
    return this.tourService.createTour(data);
  }

  async deleteTour(id) {
    console.log(`[LOG - TourService] Attempting to delete tour with ID: ${id}`);
    return this.tourService.deleteTour(id);
  }
  // Các phương thức khác có thể được Decorate tương tự
}

// Concrete Decorator 2: Thêm chức năng Caching (đơn giản hóa)
class TourServiceWithCaching extends TourServiceDecorator {
  constructor(tourService) {
    super(tourService);
    this.cache = new Map();
  }

  async getTourById(id) {
    if (this.cache.has(id)) {
      console.log(`[CACHE - TourService] Returning cached tour for ID: ${id}`);
      return this.cache.get(id);
    }
    
    const tour = await this.tourService.getTourById(id);
    this.cache.set(id, tour); // Cache kết quả
    console.log(`[CACHE - TourService] Caching tour for ID: ${id}`);
    return tour;
  }
  
  // Khi tour bị thay đổi, xóa cache
  async updateTour(id, data) {
    this.cache.delete(id);
    return this.tourService.updateTour(id, data);
  }
}

module.exports = { TourServiceWithLogging, TourServiceWithCaching };