import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increments and gets the next sequence number for a given counter key.
 *
 * @param {string} name - The identifier for the counter (e.g. 'PRJ-2026', 'PRP-2026', 'task-PRJ-2026-0001')
 * @param {ClientSession} [session] - Optional mongoose session
 * @returns {Promise<number>}
 */
export const getNextSequence = async (name, session = null) => {
  const options = { new: true, upsert: true };
  if (session) options.session = session;

  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    options
  );

  return counter.seq;
};

export default Counter;
