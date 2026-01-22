const Contact = require('../models/Contact');

// 1. Khách gửi liên hệ
exports.createContact = async (req, res) => {
  try {
    const newContact = await Contact.create(req.body);
    res.status(201).json({ status: 'success', data: newContact });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// 2. Admin lấy danh sách
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort('-createdAt');
    res.status(200).json({ status: 'success', data: contacts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// 3. Admin cập nhật trạng thái (HÀM NÀY ĐANG THIẾU DẪN ĐẾN LỖI)
exports.updateContactStatus = async (req, res) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedContact) {
      return res.status(404).json({ status: 'fail', message: 'Không tìm thấy liên hệ' });
    }

    res.status(200).json({ status: 'success', data: updatedContact });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy bản ghi liên hệ này với ID đã cung cấp.'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};