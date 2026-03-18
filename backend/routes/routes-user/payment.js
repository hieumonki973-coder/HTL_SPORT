app.post("/payment-notify", express.json(), async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", data);

  if (data.resultCode === 0) {
    try {
      let cartItems = [];
      if (data.extraData) {
        cartItems = JSON.parse(Buffer.from(data.extraData, 'base64').toString());
      }

      const orderData = {
        orderId: data.orderId,
        amount: data.amount,
        requestId: data.requestId,
        transId: data.transId,
        orderInfo: data.orderInfo,
        payType: data.payType,
        signature: data.signature,
        products: cartItems, // lưu danh sách sản phẩm
        time: new Date(),
      };

      await order.create(orderData);
      return res.status(200).json({ message: "✅ Đơn hàng đã lưu thành công", order: orderData });

    } catch (error) {
      console.error("❌ Lỗi khi lưu đơn hàng:", error);
      return res.status(500).json({ message: "Lỗi server khi lưu đơn hàng" });
    }

  } else {
    return res.status(400).json({ message: "❌ Giao dịch thất bại", data });
  }
});
