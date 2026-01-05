
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
    // 1. Tìm tour trong database dựa trên ID từ params
    const tour = await Tour.findById(req.params.id);

    // 2. Kiểm tra xem tour có tồn tại hay không
    if (!tour) {
     
      return res.status(404).json({ 
        status: 'fail', 
        message: 'Không tìm thấy tour để xóa.' 
      });
    }

    // 3. KIỂM TRA ĐIỀU KIỆN: Nếu tour có ngày khởi hành (startDates)
    // Lưu ý: Tên trường trong Model của bạn có thể là startDates hoặc startDate, hãy kiểm tra lại nhé.
    const hasDates = (tour.startDate && tour.startDate.length > 0) ;

    if (hasDates) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tour này đã có ngày khởi hành. Vui lòng xóa hết các ngày này trước khi xóa tour!'
      });
    }

    // 4. Nếu hợp lệ (không có ngày đi), thực hiện xóa
    await Tour.findByIdAndDelete(req.params.id);

    // 5. Trả về phản hồi thành công (204 No Content)
    res.status(204).json({ 
      status: 'success', 
      data: null 
    }); 

  } catch (error) {
    // Xử lý các lỗi hệ thống hoặc lỗi ép kiểu ID
    res.status(400).json({ 
      status: 'fail', 
      message: error.message 
    });
  }
};

exports.getTop5Rated = async (req, res) => {
  try {
   const tours = await Tour.find({ 
      averageRating: { $gt: 3 }, 
     
    })
    .sort({ averageRating: -1 }) 
    .limit(4);

    // 2. Trả về kết quả
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'fail', 
      message: error.message 
    });
  }
};