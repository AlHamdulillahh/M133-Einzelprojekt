import { Application, Router, send } from "https://deno.land/x//oak/mod.ts";
import { Product } from "./product.ts";
import { Cart } from "./cart.ts";
const { cwd, stdout, copy } = Deno;
import * as dejs from "https://deno.land/x/dejs@0.9.3/mod.ts";
import { renderFile } from "https://deno.land/x/dejs/mod.ts";
import { Session } from "https://deno.land/x/session@1.1.0/mod.ts";

const products: Product[] = new Array<Product>();

const data = Deno.readTextFile("./assets/data/products.json");

const session = new Session({ framework: "oak" });
await session.init();

data.then((response) => {
  return JSON.parse(response);
}).then((jsonData) => {
  for (const element of jsonData) {
    products.push(element);
  }
});

const router = new Router();
router

// Index-Page

  .get("/", async (context) => {
    context.response.body = await renderFile(
      `${cwd()}/views/index.ejs`,
      { products },
    );
  })

  // Products

  .get("/product/:id", async (context) => {
    if (
      context.params && context.params.id &&
      products.find((product) => product.id == context.params.id)
    ) {
      const product = products.find((product) =>
        product.id == context.params.id
      );
      context.response.body = await renderFile(
        `${cwd()}/views/details.ejs`,
        { product },
      );
    }
  })
  // Cart

  .get("/cart", async (context) => {
    let cart = await context.state.session.get("cart");

    context.response.body = await renderFile(
      `${cwd()}/views/cart.ejs`,
      { name: "Cart", cart },
    );
  })
  .get("/api/cart/total", async (context) => {
    let cart = await context.state.session.get("cart");
    if (cart == undefined || cart.length == 0) {
      context.response.body = "0.00";
    } else {
      let total = 0;
      cart.forEach((item: Cart) => {
        let subTotal = item.unitPrice * item.amount;
        total += subTotal;
      });

      context.response.body = total;
    }
  })
  .put("/api/cart/increase/:id", async (context) => {
    let shoppingCart = new Array<Cart>();
    if (await context.state.session.get("cart") == undefined) {
      await context.state.session.set("cart", shoppingCart);
    }

    let cart = await context.state.session.get("cart");
    const product = products.find((x) =>
      Number(x.id) === Number(context.params.id)
    );

    if (product == undefined) {
      context.response.status = 404;
      context.response.body = "Error: Product not found / Doesn't exist";
    } else {
      // Check if the product already exists in the cart. If it exists update it
      let proInCart = cart.find((x: Cart) =>
        Number(x.id) === Number(context.params.id)
      );
      if (proInCart != undefined) {
        proInCart.amount++;
        proInCart.total = proInCart.unitPrice * proInCart.amount;
      } else {
        let item: Cart = {
          id: product.id,
          productName: product.productName,
          unitPrice: product.specialOffer,
          amount: 1,
          total: product.specialOffer,
        };
        await context.state.session.set("cart", [...cart, item]);
      }

      let newCart = await context.state.session.get("cart");
      context.response.body = newCart;
    }
  })
  .put("/api/cart/decrease/:id", async (context) => {
    let cart = await context.state.session.get("cart");

    let proInCart = cart.find((x: Cart) =>
      Number(x.id) === Number(context.params.id)
    );

    // Check if product amount is 1. If its one remove it from array. Else decrement amount
    if (proInCart.amount == 1) {
      cart = cart.filter((t: Cart) => t.id != context.params.id);
    } else {
      proInCart.amount--;
      proInCart.total = proInCart.unitPrice * proInCart.amount;
    }
    
    await context.state.session.set("cart", cart);
    context.response.body = cart;
  })
  // Checkout

  .get("/checkout", async (context) => {
    let cart = await context.state.session.get("cart");
    if(cart == undefined || cart.length == 0) {
      context.response.body = await renderFile(
        `${cwd()}/views/checkoutDenied.ejs`,
        { name: "Checkout" },
      );
    } else {
    context.response.body = await renderFile(
      `${cwd()}/views/checkout.ejs`,
      { name: "Checkout" },
    );
    }
  })
  .post("/api/checkout", async (context) => {
    context.state.session.set("cart", undefined);
    context.response.body = await renderFile(
      `${cwd()}/views/checkoutSuccess.ejs`,
      { message: `Sie haben Ihren Einkauf erfolgreich abgeschlossen!` },
    );
  });

const app = new Application();

app.use(session.use()(session));
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/assets`,
  });
});

await app.listen({ port: 8000 });
