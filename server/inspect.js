import mongoose from 'mongoose';
import Student from './src/models/Student.js';
import Fee from './src/models/Fee.js';

const MONGODB_URI = 'mongodb+srv://galaxyadmin:Galaxy%402025Library@galaxylibrary.mcmoplb.mongodb.net/library_management?appName=galaxylibrary&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const student = await Student.findOne({ studentId: 'STUaman_4278' }).lean();
  console.log('STUDENT:', student);
  
  if (student) {
    const fees = await Fee.find({ studentId: student._id }).lean();
    console.log('FEES:', fees);
  }
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
