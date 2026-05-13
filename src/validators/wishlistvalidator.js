const wishlistValidator = (req, res, next) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({
      success: false,
      message: "userId and productId required",
    });
  }

  next();
};

export default wishlistValidator; 