import Request from '../models/Request.js';
import Student from '../models/Student.js';

export const createRequest = async (req, res) => {
  try {
    const { studentId, requestType, details, admissionData } = req.body;
    
    // Get student details
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newRequest = new Request({
      organizationId: student.organizationId,
      branchId: student.branchId,
      studentId: student._id,
      studentDisplayId: student.studentId,
      studentName: student.name,
      requestType,
      details,
      admissionData,
      status: 'pending'
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating request', error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedRequest) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error updating request', error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);
    if (!deletedRequest) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting request', error: error.message });
  }
};

export const createPublicAdmissionRequest = async (req, res) => {
  try {
    const { details, admissionData } = req.body;
    const newRequest = new Request({
      organizationId: 'default',
      branchId: 'default',
      studentName: admissionData.name || 'New Admission',
      requestType: 'admission',
      details,
      admissionData,
      status: 'pending'
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating request', error: error.message });
  }
};

