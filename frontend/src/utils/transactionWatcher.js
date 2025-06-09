export const watchTransaction = async (txPromise, callback) => {
    try {
        // Notify that transaction is being prepared
        callback("preparing")

        // Wait for transaction to be sent
        const tx = await txPromise
        callback("pending", tx.hash)

        // Wait for transaction confirmation
        const receipt = await tx.wait()

        if (receipt.status === 1) {
            callback("confirmed", receipt)
            return true
        } else {
            callback("failed", receipt)
            return false
        }
    } catch (error) {
        callback("error", error)
        throw error
    }
}
