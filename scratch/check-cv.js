const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://jobverse_user:jobverse_user@cluster0.p0qjt.mongodb.net/Jobify?retryWrites=true&w=majority';

async function check() {
    await mongoose.connect(MONGODB_URI);
    const CV = mongoose.models.CV || mongoose.model('CV', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }));
    const cvs = await CV.find({ userId: new mongoose.Types.ObjectId('000000000000000000000001') });
    console.log('CVs found:', cvs.length);
    process.exit(0);
}

check();
