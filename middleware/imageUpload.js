const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs'); // 🚨 THÊM: Import module File System
const path = require('path'); // 🚨 THÊM: Import module Path
const catchAsync = require('../utils/catchAsync'); // Giả định bạn có một helper catchAsync

// 🚨 TẠO THƯ MỤC LƯU TRỮ NẾU CHƯA TỒN TẠI 🚨
// Đảm bảo đường dẫn tuyệt đối bắt đầu từ thư mục gốc của dự án (process.cwd())
const uploadPath = path.join(process.cwd(), 'public', 'img', 'tours');

try {
    // Sử dụng recursive: true để tạo tất cả các thư mục cha (public, img) nếu chúng chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`[File System] Đã tạo thư mục lưu trữ ảnh: ${uploadPath}`);
    }
} catch (err) {
    console.error('[File System ERROR] Không thể kiểm tra hoặc tạo thư mục lưu trữ ảnh:', err);
    // Lưu ý: Nếu xảy ra lỗi nghiêm trọng ở đây, ứng dụng có thể không hoạt động đúng
}
// ----------------------------------------------------------------------


// 1. Cấu hình Multer Storage: Lưu file vào bộ nhớ (Buffer)
// Mục đích: Resize ảnh trước khi lưu vào đĩa, giúp kiểm soát chất lượng và kích thước.
const multerStorage = multer.memoryStorage();

// 2. Cấu hình Multer Filter: Đảm bảo chỉ chấp nhận file ảnh
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        // Thay thế bằng một đối tượng lỗi phù hợp trong môi trường thực tế
        cb(new Error('Tệp tải lên không phải là ảnh! Vui lòng chỉ tải lên ảnh.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// 3. Middleware xử lý upload đa file (Multiple fields upload)
exports.uploadTourImages = upload.fields([
    // 1 ảnh bìa (cover image)
    { name: 'imageCover', maxCount: 1 },
    // Tối đa 5 ảnh phụ
    { name: 'images', maxCount: 5 }
]);

// 4. Middleware resize và xử lý ảnh
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // Nếu không có bất kỳ file nào được upload, bỏ qua
    if (!req.files || (!req.files.imageCover && !req.files.images)) return next();

    // 🚨 QUAN TRỌNG: Đường dẫn lưu file được thay đổi để sử dụng uploadPath đã được kiểm tra ở trên
    
    // 4a. Xử lý Ảnh Bìa (imageCover) - Ảnh cần phải rõ nét
    if (req.files.imageCover) {
        const imageCoverFilename = `tour-${req.params.id || Date.now()}-cover.jpeg`;
        
        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333) // Tỷ lệ 3:2
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            // SỬ DỤNG path.join ĐỂ ĐẢM BẢO ĐƯỜNG DẪN CHÍNH XÁC
            .toFile(path.join(uploadPath, imageCoverFilename));

        // Gán tên file đã xử lý vào req.body để Service có thể lấy
        req.body.imageCover = imageCoverFilename;
    }


    // 4b. Xử lý Ảnh Phụ (images) - Tối đa 5 ảnh
    if (req.files.images) {
        req.body.images = []; 

        // Sử dụng Promise.all để xử lý tất cả ảnh bất đồng bộ (concurrently)
        await Promise.all(
            req.files.images.map(async (file, i) => {
                const filename = `tour-${req.params.id || Date.now()}-${i + 1}.jpeg`;

                // Resize ảnh phụ (ví dụ: 500px rộng, nén 70%, định dạng jpeg)
                await sharp(file.buffer)
                    .resize(500, 333) // Kích thước nhỏ hơn ảnh bìa
                    .toFormat('jpeg')
                    .jpeg({ quality: 70 })
                    // SỬ DỤNG path.join ĐỂ ĐẢM BẢO ĐƯỜNG DẪN CHÍNH XÁC
                    .toFile(path.join(uploadPath, filename)); 

                // Thêm tên file vào mảng images
                req.body.images.push(filename);
            })
        );
    }


    next();
});