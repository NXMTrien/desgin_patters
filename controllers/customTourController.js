// controllers/customTourController.js
const CustomTourRequest = require('../models/CustomTourRequest'); 
const { ConcreteCustomTourBuilder, CustomTourDirector } = require('../patterns/CustomTourBuilder');

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
            destination: customTourDetails.destination,
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