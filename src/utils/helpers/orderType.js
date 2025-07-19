const checkOrderType = (value) => {
  const type = [
    { id: 1, name: "Dine In" },
    { id: 2, name: "Takeaway" },
    { id: 3, name: "Spot Order" },
    { id: 4, name: "Delivery" },
    { id: 5, name: "Dine In" },
    { id: 6, name: "Car Hop" },
    { id: 7, name: "Pick Up" },
  ];  
  return type.find((i) => i?.id == value)?.name;
};

export { checkOrderType };
