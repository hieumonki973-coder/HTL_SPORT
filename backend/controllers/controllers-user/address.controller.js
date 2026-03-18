const Address = require('../../model/address.model');

const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId || null;

exports.getMyAddresses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Không xác định được người dùng' });
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: addresses });
  } catch (err) {
    console.error('❌ getMyAddresses:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('📥 addAddress body:', req.body);
    console.log('👤 userId:', userId);
    if (!userId) return res.status(401).json({ success: false, message: 'Không xác định được người dùng' });

    const { fullName, phone, tinh, quan, phuong, duong, soNha, isDefault } = req.body;
    const missing = ['fullName','phone','tinh','quan','phuong','duong','soNha'].filter(f => !req.body[f]);
    if (missing.length) return res.status(400).json({ success: false, message: `Thiếu: ${missing.join(', ')}` });

    if (isDefault) await Address.updateMany({ userId }, { isDefault: false });
    const count = await Address.countDocuments({ userId });

    const address = new Address({
      userId, fullName, phone, tinh, quan, phuong, duong, soNha,
      isDefault: count === 0 ? true : !!isDefault
    });
    await address.save();
    res.status(201).json({ success: true, data: address, message: 'Thêm địa chỉ thành công' });
  } catch (err) {
    console.error('❌ addAddress error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Không xác định được người dùng' });
    const { id } = req.params;
    const { fullName, phone, tinh, quan, phuong, duong, soNha, isDefault } = req.body;
    const address = await Address.findOne({ _id: id, userId });
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    if (isDefault) await Address.updateMany({ userId }, { isDefault: false });
    Object.assign(address, { fullName, phone, tinh, quan, phuong, duong, soNha, isDefault: !!isDefault });
    await address.save();
    res.json({ success: true, data: address, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('❌ updateAddress:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Không xác định được người dùng' });
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId });
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    if (address.isDefault) {
      const first = await Address.findOne({ userId }).sort({ createdAt: 1 });
      if (first) { first.isDefault = true; await first.save(); }
    }
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    console.error('❌ deleteAddress:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Không xác định được người dùng' });
    await Address.updateMany({ userId }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    res.json({ success: true, data: address, message: 'Đặt mặc định thành công' });
  } catch (err) {
    console.error('❌ setDefaultAddress:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};