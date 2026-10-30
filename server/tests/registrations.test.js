jest.mock('../src/models/Registration', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn()
}));

jest.mock('../src/models/Event', () => ({
  findById: jest.fn()
}));

jest.mock('../src/models/User', () => ({
  findById: jest.fn()
}));

const Registration = require('../src/models/Registration');
const registrationService = require('../src/services/registrationService');

describe('event registration behavior', () => {
  const user = { _id: 'user-1', email: 'student@example.edu' };
  const event = { _id: 'event-1', title: 'Campus Fair', capacity: 10 };
  let notifier;

  beforeEach(() => {
    Registration.findOne.mockReset();
    Registration.countDocuments.mockReset();
    Registration.create.mockReset();
    notifier = { send: jest.fn().mockResolvedValue(true) };
  });

  test('confirms an attendee and sends exactly one notification while capacity remains', async () => {
    const savedRegistration = { status: 'confirmed' };
    Registration.findOne.mockResolvedValue(null);
    Registration.countDocuments.mockResolvedValue(9);
    Registration.create.mockResolvedValue(savedRegistration);

    const result = await registrationService.register({ user, event, notifier });

    expect(Registration.create).toHaveBeenCalledWith({
      userId: user._id,
      eventId: event._id,
      status: 'confirmed'
    });
    expect(result).toBe(savedRegistration);
    expect(notifier.send).toHaveBeenCalledTimes(1);
    expect(notifier.send).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining('confirmed')
    );
  });

  test('waitlists an attendee when event capacity is full', async () => {
    Registration.findOne.mockResolvedValue(null);
    Registration.countDocuments.mockResolvedValue(event.capacity);
    Registration.create.mockResolvedValue({ status: 'waitlisted' });

    const result = await registrationService.register({ user, event, notifier });

    expect(result.status).toBe('waitlisted');
    expect(Registration.create).toHaveBeenCalledWith({
      userId: user._id,
      eventId: event._id,
      status: 'waitlisted'
    });
    expect(notifier.send).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining('waitlist')
    );
  });

  test('rejects a second active registration for the same attendee and event', async () => {
    Registration.findOne.mockResolvedValue({
      status: 'confirmed'
    });

    await expect(registrationService.register({ user, event, notifier }))
      .rejects.toBeInstanceOf(registrationService.AlreadyRegistered);

    expect(Registration.countDocuments).not.toHaveBeenCalled();
    expect(Registration.create).not.toHaveBeenCalled();
    expect(notifier.send).not.toHaveBeenCalled();
  });

  test('cancels a confirmed registration and promotes the earliest waitlisted attendee', async () => {
    const confirmed = {
      status: 'confirmed',
      save: jest.fn().mockResolvedValue(undefined)
    };
    const earliestWaitlisted = {
      status: 'waitlisted',
      save: jest.fn().mockResolvedValue(undefined)
    };
    const waitlistQuery = {
      sort: jest.fn().mockResolvedValue(earliestWaitlisted)
    };
    Registration.findOne
      .mockResolvedValueOnce(confirmed)
      .mockReturnValueOnce(waitlistQuery);

    const result = await registrationService.cancel({
      user,
      eventId: event._id
    });

    expect(result).toBe(true);
    expect(confirmed.status).toBe('cancelled');
    expect(confirmed.save).toHaveBeenCalledTimes(1);
    expect(Registration.findOne).toHaveBeenNthCalledWith(2, {
      eventId: event._id,
      status: 'waitlisted'
    });
    expect(waitlistQuery.sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(earliestWaitlisted.status).toBe('confirmed');
    expect(earliestWaitlisted.save).toHaveBeenCalledTimes(1);
  });
});
