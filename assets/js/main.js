getCartTotal();

async function addToCart(id) {
  await fetch(`/api/cart/increase/${id}`, {
    method: "PUT",
  });
  location.reload();
}

async function removeFromCart(id) {
  await fetch(`/api/cart/decrease/${id}`, {
    method: "PUT",
  });
  location.reload();
}

async function getCartTotal() {
  let request = await fetch("/api/cart/total");
  let cart = await request.json();

  let miniCart = document.querySelector("#miniCart");
  miniCart.innerHTML = "";
  miniCart.innerHTML = "CHF " + cart.toFixed(2);
}

async function checkOut(sender) {
  const data = {
    firstName: sender.querySelector("#firstName").value,
    lastName: sender.querySelector("#lastName").value,
    email: sender.querySelector("#email").value,
  };

  await fetch(
    "/api/checkout",
    {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
}
