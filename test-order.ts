async function test() {
  const orderPayload = {
    customerName: "Cliente Teste",
    customerPhone: "5584986113980",
    deliveryMethod: "pickup",
    paymentMethod: "pix",
    observation: "Pedido de teste do robô",
    items: [],
    totalPrice: 0
  };

  try {
    const res = await fetch('http://localhost:3000/api/stores/barraca-do-samuel/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    console.log("POST Status:", res.status);
    const data = await res.json();
    console.log("POST Response:", data);
  } catch (e) {
    console.error("Error posting order:", e);
  }
}

test();
