const ReportSchema = new Schema({
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true }, // e.g., 'fine', 'borrow', 'book'
    generatedAt: { type: Date, default: Date.now },
    details: { type: String, required: true }
  });
  
  const Report = mongoose.model('Report', ReportSchema);
  module.exports = Report;
  