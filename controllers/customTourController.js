// controllers/customTourController.js
const CustomTourRequest = require('../models/CustomTourRequest'); 
const { ConcreteCustomTourBuilder, CustomTourDirector } = require('../patterns/CustomTourBuilder');
const Booking = require('../models/Booking');

// Khởi tạo Builder và Director
const builder = new ConcreteCustomTourBuilder();
const director = new CustomTourDirector();

exports.createCustomTour = async (req, res) => { // Thêm async
    try {
        const { destination, duration, transportation, accommodation, activities } = req.body;
        
        // 1. Xây dựng tour bằng Builder Pattern
        builder.setDestination(destination)
               .setDuration(duration)
               .setTransportation(transportation)
               .setAccommodation(accommodation);

        if (activities && Array.isArray(activities)) {
            activities.forEach(act => builder.addActivity(act));
        }

        const customTourDetails = builder.build(); // Lấy chi tiết tour (bao gồm estimatedPrice)

        // 2. Tạo đối tượng Request để lưu vào DB
        const newRequest = await CustomTourRequest.create({
            user: req.user.id, // Lấy User ID từ token (sau khi qua protect middleware)
            title: customTourDetails.destination,
            durationDays: customTourDetails.durationDays,
            transportation: customTourDetails.transportation,
            accommodation: customTourDetails.accommodation,
            activities: customTourDetails.activities,
            estimatedPrice: customTourDetails.estimatedPrice,
            status: 'pending'
        });

        res.status(201).json({ // Trả về 201 Created
            status: 'success',
            message: 'Yêu cầu tour tùy chỉnh đã được ghi nhận. Chúng tôi sẽ liên hệ sớm!',
            data: { request: newRequest }
        });

    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};
exports.getAllRequests = async (req, res) => {
    try {
        // Chỉ Admin mới được truy cập hàm này (Cần thêm middleware protect và checkAdmin)
        const requests = await CustomTourRequest.find()
            .populate('user', 'username email'); // Lấy thông tin cơ bản của người dùng
        
        res.status(200).json({
            status: 'success',
            count: requests.length,
            data: { requests }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


exports.confirmCustomTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { numberOfPeople, startDate,finalPrice } = req.body; 


    const customTour = await CustomTourRequest.findById(id).populate('user');
    if (!customTour) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tour' });
    }

    // Cập nhật trạng thái custom tour
    customTour.status = 'booked';
    if (finalPrice) customTour.finalPrice = finalPrice; 
    await customTour.save();

    // ✅ Tạo booking mới cho custom tour
    const booking = new Booking({
      customTour: customTour._id,
      user: customTour.user._id,
      tour: customTour._id, 
      numberOfPeople: numberOfPeople || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      totalPrice: finalPrice || customTour.estimatedPrice,
      status: 'pending_payment'
    });

    await booking.save();

    res.status(200).json({
      message: 'Yêu cầu tour đã được xác nhận và tạo booking thành công!',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi xác nhận tour tùy chỉnh' });
  }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, finalPrice, notes } = req.body;
        const validUpdates = {};

        if (status) validUpdates.status = status;
        if (finalPrice) validUpdates.finalPrice = finalPrice;
        if (notes) validUpdates.adminNotes = notes;

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ message: 'Không có trường nào hợp lệ để cập nhật.' });
        }

        const updatedRequest = await CustomTourRequest.findByIdAndUpdate(
            req.params.id,
            validUpdates,
            { new: true, runValidators: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu tour.' });
        }
        
        // Đây là điểm mà Request có thể chuyển thành Booking (status = confirmed)
        // Nếu updatedRequest.status === 'confirmed', bạn có thể thêm logic
        // để tạo bản ghi Booking chính thức vào đây.

        res.status(200).json({
            status: 'success',
            message: `Yêu cầu tour ${req.params.id} đã được cập nhật.`,
            data: { request: updatedRequest }
        });

    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

exports.getPredefinedTour = (req, res) => {
    try {
        const { type } = req.query; // Ví dụ: ?type=adventure

        let customTour;

        if (type === 'adventure') {
            customTour = director.constructAdventureTour(builder);
        } else if (type === 'luxury') {
            customTour = director.constructLuxuryTour(builder);
        } else {
             return res.status(404).json({ status: 'fail', message: 'Loại tour định sẵn không hợp lệ.' });
        }

        res.status(200).json({
            status: 'success',
            message: `Tour định sẵn loại ${type} đã được tạo.`,
            data: { customTour }
        });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};