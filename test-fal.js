async function testKey(key) {
  try {
    const res = await fetch("https://queue.fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}) // Intentionally empty to see error
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (e) {
    console.error(e);
  }
}
testKey("invalid_key");
