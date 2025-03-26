import { Express, Request, Response } from "express";
import { storage } from "./storage";

export function registerPatientPortalRoutes(app: Express) {
  // Patient Portal API endpoints
  app.get('/api/patient-portal/appointments', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      
      // Add additional appointment metadata for the patient portal
      const enhancedAppointments = appointments.map(appt => ({
        ...appt,
        type: 'appointment',
        doctorName: 'Dr. Smith', // In a real app, this would come from the appointment's doctor relationship
        location: '123 Medical Center Blvd, Suite 200', // In a real app, this would be stored in the appointment
      }));
      
      res.json(enhancedAppointments);
    } catch (error) {
      console.error('Error fetching patient portal appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });
  
  app.post('/api/patient-portal/appointments/request', async (req, res) => {
    try {
      const { patientId, appointmentDate, reason } = req.body;
      
      if (!patientId || !appointmentDate || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In a real app, this would create a "requested" appointment that would need staff approval
      const appointment = await storage.createAppointment({
        patientId,
        appointmentDate: new Date(appointmentDate),
        reason,
        status: 'Requested', // Special status for patient-requested appointments
        notes: null,
        smsReminderSent: false
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error requesting appointment:', error);
      res.status(400).json({ error: 'Failed to request appointment' });
    }
  });
  
  app.post('/api/patient-portal/appointments/:id/cancel-request', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // In a real app, this might create a cancellation request rather than immediately cancelling
      const updatedAppointment = await storage.updateAppointment(id, {
        status: 'Cancellation Requested'
      });
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error requesting appointment cancellation:', error);
      res.status(500).json({ error: 'Failed to request appointment cancellation' });
    }
  });
  
  app.get('/api/patient-portal/history', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      const historyEntries = await storage.getAllPatientHistory(patientId);
      
      // Add additional metadata if needed
      const enhancedHistory = historyEntries.map(entry => ({
        ...entry,
        type: entry.type || 'history', // Set default type if not already set
        recordedBy: entry.recordedBy || 'Dr. Johnson', // In a real app, this would be stored in the entry
      }));
      
      res.json(enhancedHistory);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      res.status(500).json({ error: 'Failed to fetch patient history' });
    }
  });
  
  app.get('/api/patient-portal/documents', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      const documents = await storage.getPatientDocuments(patientId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      res.status(500).json({ error: 'Failed to fetch patient documents' });
    }
  });
  
  app.get('/api/patient-portal/questionnaires', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      // This would normally come from a database, but for the demo we'll create sample data
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      // Get appointments to link questionnaires to
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      const upcomingAppointments = appointments.filter(a => new Date(a.appointmentDate) > today);
      
      const questionnaires = [
        {
          id: 1,
          title: 'Pre-Visit Questionnaire',
          description: 'Please complete this questionnaire before your upcoming appointment',
          createdAt: today,
          dueDate: nextWeek,
          status: 'pending',
          questions: [
            {
              id: 'symptoms',
              text: 'Please describe your current symptoms and how long you have been experiencing them',
              type: 'text',
              required: true
            },
            {
              id: 'severity',
              text: 'How would you rate the severity of your symptoms?',
              type: 'radio',
              options: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
              required: true
            },
            {
              id: 'medications',
              text: 'Are you currently taking any medications?',
              type: 'text',
              required: false
            },
            {
              id: 'allergies',
              text: 'Do you have any allergies we should be aware of?',
              type: 'text',
              required: false
            }
          ],
          appointmentId: upcomingAppointments[0]?.id,
          appointmentDate: upcomingAppointments[0]?.appointmentDate,
          appointmentReason: upcomingAppointments[0]?.reason
        },
        {
          id: 2,
          title: 'Annual Health Assessment',
          description: 'General health questionnaire for your annual checkup',
          createdAt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          dueDate: new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
          status: 'completed',
          questions: [
            {
              id: 'overall_health',
              text: 'How would you rate your overall health?',
              type: 'radio',
              options: ['Excellent', 'Good', 'Fair', 'Poor'],
              required: true
            },
            {
              id: 'physical_limitations',
              text: 'Do you have any physical limitations that affect your daily activities?',
              type: 'radio',
              options: ['None', 'Mild', 'Moderate', 'Severe'],
              required: true
            },
            {
              id: 'diet',
              text: 'How would you describe your diet?',
              type: 'text',
              required: false
            },
            {
              id: 'exercise',
              text: 'How often do you exercise?',
              type: 'radio',
              options: ['Daily', '2-3 times per week', 'Once per week', 'Rarely', 'Never'],
              required: true
            }
          ]
        }
      ];
      
      res.json(questionnaires);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      res.status(500).json({ error: 'Failed to fetch questionnaires' });
    }
  });
  
  app.get('/api/patient-portal/questionnaire-responses', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      // This would normally come from a database
      const responses = [
        {
          id: 1,
          questionnaireId: 2,
          patientId: patientId,
          submittedAt: new Date(new Date().getTime() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
          answers: {
            'overall_health': 'Good',
            'physical_limitations': 'None',
            'diet': 'Balanced diet with occasional processed foods',
            'exercise': '2-3 times per week'
          }
        }
      ];
      
      res.json(responses);
    } catch (error) {
      console.error('Error fetching questionnaire responses:', error);
      res.status(500).json({ error: 'Failed to fetch questionnaire responses' });
    }
  });
  
  app.post('/api/patient-portal/questionnaire-responses', async (req, res) => {
    try {
      const { questionnaireId, patientId, answers } = req.body;
      
      if (!questionnaireId || !patientId || !answers) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In a real app, this would save to the database
      const response = {
        id: Math.floor(Math.random() * 1000) + 2, // Generate random ID (for demo)
        questionnaireId,
        patientId,
        submittedAt: new Date(),
        answers
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error submitting questionnaire response:', error);
      res.status(400).json({ error: 'Failed to submit questionnaire response' });
    }
  });
  
  app.get('/api/patient-portal/medications', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      // This would normally come from a database
      const today = new Date();
      const oneMonthFromNow = new Date(today);
      oneMonthFromNow.setMonth(today.getMonth() + 1);
      
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(today.getDate() + 14);
      
      const medications = [
        {
          id: 1,
          patientId: patientId,
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          endDate: oneMonthFromNow,
          refillsRemaining: 2,
          isActive: true,
          instructions: 'Take in the morning with food',
          prescribedBy: 'Dr. Smith',
          lastRefill: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          nextRefillDate: twoWeeksFromNow,
          pharmacy: 'Main Street Pharmacy',
          createdAt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          patientId: patientId,
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          startDate: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          endDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          refillsRemaining: 0,
          isActive: false,
          instructions: 'Take with breakfast and dinner',
          prescribedBy: 'Dr. Johnson',
          lastRefill: null,
          nextRefillDate: null,
          pharmacy: 'Care Pharmacy',
          createdAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
        }
      ];
      
      res.json(medications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      res.status(500).json({ error: 'Failed to fetch medications' });
    }
  });
  
  app.get('/api/patient-portal/refill-requests', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      // This would normally come from a database
      const refillRequests = [
        {
          id: 1,
          medicationId: 1,
          patientId: patientId,
          requestDate: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          status: 'completed',
          notes: 'Running low on medication',
          pharmacy: 'Main Street Pharmacy',
          responseDate: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          responseNotes: 'Refill approved for 30 days',
          createdAt: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000)
        }
      ];
      
      res.json(refillRequests);
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      res.status(500).json({ error: 'Failed to fetch refill requests' });
    }
  });
  
  app.post('/api/patient-portal/refill-requests', async (req, res) => {
    try {
      const { medicationId, patientId, notes, pharmacy } = req.body;
      
      if (!medicationId || !patientId || !pharmacy) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In a real app, this would save to the database
      const refillRequest = {
        id: Math.floor(Math.random() * 1000) + 2, // Generate random ID (for demo)
        medicationId,
        patientId,
        requestDate: new Date(),
        status: 'pending',
        notes: notes || null,
        pharmacy,
        responseDate: null,
        responseNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.status(201).json(refillRequest);
    } catch (error) {
      console.error('Error creating refill request:', error);
      res.status(400).json({ error: 'Failed to create refill request' });
    }
  });
  
  app.get('/api/patient-portal/departments', async (req, res) => {
    // This would normally come from a database
    const departments = [
      { id: 1, name: 'Primary Care' },
      { id: 2, name: 'Cardiology' },
      { id: 3, name: 'Dermatology' },
      { id: 4, name: 'Endocrinology' },
      { id: 5, name: 'Billing & Insurance' },
      { id: 6, name: 'Medical Records' }
    ];
    
    res.json(departments);
  });
  
  app.get('/api/patient-portal/conversations', async (req, res) => {
    try {
      const patientId = parseInt(req.query.patientId as string);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }
      
      // This would normally come from a database
      const today = new Date();
      
      const conversations = [
        {
          id: 1,
          patientId: patientId,
          subject: 'Question about medication side effects',
          departmentId: 1,
          departmentName: 'Primary Care',
          assignedToId: 101,
          assignedToName: 'Dr. Smith',
          status: 'active',
          priority: 'normal',
          lastMessageAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          unreadCount: 1,
          lastMessage: 'Your doctor has responded to your question.'
        },
        {
          id: 2,
          patientId: patientId,
          subject: 'Insurance coverage question',
          departmentId: 5,
          departmentName: 'Billing & Insurance',
          assignedToId: 202,
          assignedToName: 'Jane Doe',
          status: 'resolved',
          priority: 'normal',
          lastMessageAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          createdAt: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
          unreadCount: 0,
          lastMessage: 'Thank you for your help!'
        }
      ];
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });
  
  app.get('/api/patient-portal/messages', async (req, res) => {
    try {
      const conversationId = parseInt(req.query.conversationId as string);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }
      
      // This would normally come from a database
      const today = new Date();
      
      let messages = [];
      
      // Different messages based on conversation ID
      if (conversationId === 1) {
        messages = [
          {
            id: 1,
            conversationId: 1,
            senderId: 1, // Patient ID
            senderName: 'John Smith',
            senderRole: 'patient',
            content: "I've been experiencing headaches after taking the new medication. Is this a common side effect?",
            isRead: true,
            createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
          },
          {
            id: 2,
            conversationId: 1,
            senderId: 101, // Doctor ID
            senderName: 'Dr. Smith',
            senderRole: 'doctor',
            content: "Yes, headaches can be a side effect, especially when starting the medication. They typically subside after a week. Are they severe or mild?",
            isRead: true,
            createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            id: 3,
            conversationId: 1,
            senderId: 1, // Patient ID
            senderName: 'John Smith',
            senderRole: 'patient',
            content: "They're mild but persistent throughout the day.",
            isRead: true,
            createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            id: 4,
            conversationId: 1,
            senderId: 101, // Doctor ID
            senderName: 'Dr. Smith',
            senderRole: 'doctor',
            content: "Let's monitor this for another week. Try taking the medication with food if you haven't been. If the headaches worsen or don't improve, please call the office. Would you like me to schedule a follow-up call next week?",
            isRead: false,
            createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ];
      } else if (conversationId === 2) {
        messages = [
          {
            id: 5,
            conversationId: 2,
            senderId: 1, // Patient ID
            senderName: 'John Smith',
            senderRole: 'patient',
            content: "I received a bill for my last visit but my insurance should have covered it. Can you help?",
            isRead: true,
            createdAt: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
          },
          {
            id: 6,
            conversationId: 2,
            senderId: 202, // Staff ID
            senderName: 'Jane Doe',
            senderRole: 'staff',
            content: "I'll look into this for you. Could you please provide your insurance member ID and the date of service?",
            isRead: true,
            createdAt: new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000) // 11 days ago
          },
          {
            id: 7,
            conversationId: 2,
            senderId: 1, // Patient ID
            senderName: 'John Smith',
            senderRole: 'patient',
            content: "My insurance ID is ABC123456 and the visit was on March 15, 2023.",
            isRead: true,
            createdAt: new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000) // 11 days ago
          },
          {
            id: 8,
            conversationId: 2,
            senderId: 202, // Staff ID
            senderName: 'Jane Doe',
            senderRole: 'staff',
            content: "I've investigated and found that your insurance information wasn't updated in our system. I've resubmitted the claim and you should receive an updated statement within 2 weeks. Let me know if you have any other questions!",
            isRead: true,
            createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          },
          {
            id: 9,
            conversationId: 2,
            senderId: 1, // Patient ID
            senderName: 'John Smith',
            senderRole: 'patient',
            content: "Thank you for your help!",
            isRead: true,
            createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          }
        ];
      }
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  
  app.post('/api/patient-portal/messages', async (req, res) => {
    try {
      const { conversationId, senderId, content } = req.body;
      
      if (!conversationId || !senderId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In a real app, this would save to the database and get user info
      const message = {
        id: Math.floor(Math.random() * 1000) + 10, // Generate random ID (for demo)
        conversationId,
        senderId,
        senderName: 'John Smith', // Would be fetched from database
        senderRole: 'patient',
        content,
        isRead: false,
        createdAt: new Date()
      };
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ error: 'Failed to create message' });
    }
  });
  
  app.post('/api/patient-portal/conversations', async (req, res) => {
    try {
      const { patientId, subject, departmentId, initialMessage } = req.body;
      
      if (!patientId || !subject || !departmentId || !initialMessage) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In a real app, this would save to the database
      const now = new Date();
      
      // Get department name (would come from database)
      const departments = [
        { id: 1, name: 'Primary Care' },
        { id: 2, name: 'Cardiology' },
        { id: 3, name: 'Dermatology' },
        { id: 4, name: 'Endocrinology' },
        { id: 5, name: 'Billing & Insurance' },
        { id: 6, name: 'Medical Records' }
      ];
      
      const department = departments.find(d => d.id === parseInt(departmentId.toString()));
      
      const conversation = {
        id: Math.floor(Math.random() * 1000) + 3, // Generate random ID (for demo)
        patientId,
        subject,
        departmentId: parseInt(departmentId.toString()),
        departmentName: department?.name || 'Unknown Department',
        assignedToId: null,
        assignedToName: null,
        status: 'active',
        priority: 'normal',
        lastMessageAt: now,
        createdAt: now,
        unreadCount: 0,
        lastMessage: initialMessage
      };
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ error: 'Failed to create conversation' });
    }
  });
  
  app.post('/api/patient-portal/conversations/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // In a real app, this would update the database
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
  });
}