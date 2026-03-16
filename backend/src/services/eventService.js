const eventRepository = require("../repositories/eventRepository");

exports.logEvent = async (sessionId, type, metadata = {}) => {

  await eventRepository.logEvent(
    sessionId,
    type,
    metadata
  );

};