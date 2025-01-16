const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Borrow = require("../models/borrowBookModel.js");

// Setup nodemailer transporter (for sending emails)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rajeshky123456@gmail.com', 
    pass: 'vjfc yigc mpch jujq'
  }
});

// Cron job that runs every day at 9 AM to check for due books
cron.schedule('0 9 * * *', async () => {
  try {
    const borrows = await Borrow.find({ 
      isBorrowed: true,
      notificationSent: false,
      dueDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } 
    }).populate('user'); 

    borrows.forEach(async (borrow) => {
      const { user, book, dueDate, borrowDate } = borrow;

      // Prepare the notification email
      const mailOptions = {
        from: 'rajeshky123456@gmail.com',
        to: user.email, 
        subject: 'Library Book Due Soon',
        text: `
          Dear ${user.name},
          
          This is a reminder that the book "${book.title}" you borrowed from the library is due for return on ${dueDate.toLocaleDateString()}.
          
          Please return the book on time to avoid any fines.
          
          Best regards,
          Your Library
        `
      };

      // Send email to the user
      await transporter.sendMail(mailOptions);

      // Update the borrow document to mark that the notification has been sent
      await Borrow.findByIdAndUpdate(borrow._id, { notificationSent: true });

      console.log(`Notification sent to ${user.email} for book "${book.title}"`);
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
});
