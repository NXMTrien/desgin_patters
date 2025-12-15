
const Tour = require('../models/Tour');
const { TourService } = require('../patterns/TourService');
const { TourServiceWithLogging, TourServiceWithCaching } = require('../patterns/TourDecorator');

// Khởi tạo Tour Service và áp dụng Decorator Pattern
// Thứ tự bọc: Caching bọc Logging, Logging bọc TourService gốc
const baseTourService = new TourService(Tour);
const serviceWithLogging = new TourServiceWithLogging(baseTourService);
const decoratedTourService = new TourServiceWithCaching(serviceWithLogging);



exports.getAllTours = async (req, res) => {
  try {
    // Logic tìm kiếm, lọc, phân trang sẽ được xử lý trong service
    const tours = await decoratedTourService.getAllTours(req.query);
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await decoratedTourService.getTourById(req.params.id);
    if (!tour) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy tour.' });
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// CHỈ ADMIN MỚI ĐƯỢC PHÉP THỰC HIỆN CÁC HÀM SAU
exports.createTour = async (req, res) => {
 try {
    const data = { ...req.body };

    // 1. Kiểm tra nếu startDate gửi lên là chuỗi hoặc mảng chứa chuỗi dính
    if (data.startDate) {
      let dates = data.startDate;

      // Nếu là mảng chứa 1 chuỗi dài: ["2025-12-20,2025-12-26"]
      if (Array.isArray(dates) && dates.length === 1 && typeof dates[0] === 'string') {
        dates = dates[0];
      }

      // Nếu là chuỗi: "2025-12-20,2025-12-26" -> Tách thành mảng
      if (typeof dates === 'string') {
        data.startDate = dates.split(',').map(date => date.trim());
      }
    }

    const newTour = await decoratedTourService.createTour(data);
    res.status(201).json({ status: 'success', data: { tour: newTour } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    let tourData = { ...req.body };

    // XỬ LÝ startDate: Đảm bảo luôn là mảng chuẩn trước khi vào Database
    if (tourData.startDate) {
      // Trường hợp 1: Multer nhận nhiều giá trị cùng key -> trả về mảng ['2025-12-20', '2025-12-25'] -> OK
      // Trường hợp 2: Gửi lên 1 chuỗi dính "2025-12-20,2025-12-25" -> Cần split
      if (typeof tourData.startDate === 'string') {
        tourData.startDate = tourData.startDate.split(',').map(d => d.trim());
      } 
      // Trường hợp 3: Mảng chứa 1 chuỗi dính ['2025-12-20,2025-12-25']
      else if (Array.isArray(tourData.startDate) && tourData.startDate.length === 1) {
        if (tourData.startDate[0].includes(',')) {
          tourData.startDate = tourData.startDate[0].split(',').map(d => d.trim());
        }
      }
    }

    const tour = await decoratedTourService.updateTour(req.params.id, tourData);
    if (!tour) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy tour.' });
    
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await decoratedTourService.deleteTour(req.params.id);
    if (!tour) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy tour.' });
    res.status(204).json({ status: 'success', data: null }); // 204 No Content
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};