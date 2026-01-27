
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

    // Nếu field startDate tồn tại trong request (kể cả rỗng)
    if (req.body.startDate !== undefined) {
      if (typeof tourData.startDate === 'string') {
        // Nếu là chuỗi rỗng sau khi xóa hết badge
        tourData.startDate = tourData.startDate ? tourData.startDate.split(',').map(d => d.trim()) : [];
      } 
      else if (Array.isArray(tourData.startDate)) {
        // Lọc bỏ các giá trị null/undefined/chuỗi rỗng
        tourData.startDate = tourData.startDate.filter(d => d && d.trim() !== "");
      }
    }
    const tour = await decoratedTourService.updateTour(req.params.id, tourData);
    if (!tour) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy tour.' });
    
    res.status(200).json({ status: 'success', data: { tour } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};


exports.deleteTour = async (req, res, next) => {
    try {
        const tourId = req.params.id;

        // 1. Tìm tour để kiểm tra sự tồn tại và điều kiện startDate
        const tour = await Tour.findById(tourId);

        if (!tour) {
            return res.status(404).json({ message: "Không tìm thấy tour này!" });
        }

        // 2. Kiểm tra logic chặn: Nếu còn ngày khởi hành thì không cho xóa
        // Lưu ý: startDate phải được xóa hết ở bước Edit trước đó
        if (tour.startDate && tour.startDate.length > 0) {
            return res.status(400).json({ 
                message: "Không thể xóa! Tour vẫn còn lịch khởi hành. Vui lòng vào Chỉnh sửa để xóa hết ngày trước." 
            });
        }

        // 3. THỰC HIỆN XÓA THỰC SỰ TRONG DATABASE
        await Tour.findByIdAndDelete(tourId);

        res.status(200).json({
            status: "success",
            message: "Xóa tour thành công khỏi cơ sở dữ liệu!"
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi xóa tour: " + err.message });
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