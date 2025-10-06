
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
    const newTour = await decoratedTourService.createTour(req.body);
    res.status(201).json({ status: 'success', data: { tour: newTour } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await decoratedTourService.updateTour(req.params.id, req.body);
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