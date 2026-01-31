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

  async getTourById(id) {
    console.log(`[LOG - TourService] Attempting to find tour by ID: ${id}`);
    return this.tourService.getTourById(id);
  }
    
  async createTour(data) {
    console.log(`[LOG - TourService] Attempting to create new tour: ${data.title}`);
    return this.tourService.createTour(data);
  }

  async updateTour(id, data) {
    const updatedTour = await this.tourService.updateTour(id, data);
    
    // 2. Xóa cache của chính tour đó và xóa cache danh sách (vì trung bình sao đã đổi)
    this.cache.delete(id);
    this.clearAllCache(); 
    
    return updatedTour;
  }

  async deleteTour(id) {
    console.log(`[LOG - TourService] Attempting to delete tour with ID: ${id}`);
    return this.tourService.deleteTour(id);
  }
}

// Concrete Decorator 2: Thêm chức năng Caching (đơn giản hóa)
class TourServiceWithCaching extends TourServiceDecorator {
  constructor(tourService) {
    super(tourService);
    // Cache dùng để lưu kết quả getAllTours (query) và getTourById (ID)
    this.cache = new Map(); 
  }

    // Xóa tất cả cache
    clearCache() {
        this.cache.clear();
        console.log('[CACHE - TourService] Cache cleared due to write operation.');
    }

    // Cache cho getTourById
  async getTourById(id) {
    if (this.cache.has(id)) {
      console.log(`[CACHE - TourService] Returning cached tour for ID: ${id}`);
      return this.cache.get(id);
    }
    
    const tour = await this.tourService.getTourById(id);
    if (tour) {
        this.cache.set(id, tour); // Cache kết quả
        console.log(`[CACHE - TourService] Caching tour for ID: ${id}`);
    }
    return tour;
  }

    // Xóa cache khi tour mới được tạo
    async createTour(data) {
        const newTour = await this.tourService.createTour(data);
        this.clearCache();
        return newTour;
    }
    
    // Xóa cache khi tour bị cập nhật
  async updateTour(id, data) {
    this.cache.delete(id); // Xóa cache tour cũ
    // Xóa toàn bộ cache để đảm bảo getAllTours cũng được cập nhật
    this.clearCache();
    return this.tourService.updateTour(id, data);
  }

    // Xóa cache khi tour bị xóa
    async deleteTour(id) {
        const result = await this.tourService.deleteTour(id);
        this.cache.delete(id); // Xóa cache tour bị xóa
        this.clearCache();
        return result;
    }
    
    // Nếu bạn muốn cache getAllTours:
    async getAllTours(query) {
        const key = JSON.stringify(query); // Dùng query string làm key
        if (this.cache.has(key)) {
            console.log(`[CACHE - TourService] Cache hit for query: ${key}`);
            return this.cache.get(key);
        }
        
        const tours = await this.tourService.getAllTours(query);
        this.cache.set(key, tours);
        console.log(`[CACHE - TourService] Caching result for query: ${key}`);
        return tours;
    }
}

module.exports = { TourServiceWithLogging, TourServiceWithCaching };