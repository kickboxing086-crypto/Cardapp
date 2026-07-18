async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/stores/barraca-do-samuel/products');
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}
test();
