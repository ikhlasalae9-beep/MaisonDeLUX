// Explicit orchestration makes the pre-inference entitlement boundary testable.
export async function executeMain<T>(operations: {
  reserve: () => Promise<void>; predict: () => Promise<T>; complete: (prediction: T) => Promise<string>; release: () => Promise<void>;
}) {
  await operations.reserve();
  try {
    const prediction = await operations.predict();
    const id = await operations.complete(prediction);
    return { prediction, id };
  } catch (error) {
    await operations.release().catch(() => { /* Lease expires; a failure must never grant a second concurrent run. */ });
    throw error;
  }
}
