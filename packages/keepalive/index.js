/* eslint-disable no-process-env, no-console */
const BackEndUrl = process.env.BACKEND_URL;
const FrontEndUrl = process.env.FRONTEND_URL;

exports.handler = async () => {
  try {
    await Promise.all([fetch(BackEndUrl), fetch(FrontEndUrl)]);
    console.log('Successfully pinged front and backend.');
  } catch (error) {
    console.error('Error pinging front and backend:', error);
    throw error;
  }
};
