Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({
      message: "Resources function is operational",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});