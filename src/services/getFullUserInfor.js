const axios = require("axios");

const getFullUserInfor = async (email) => {
  const token = process.env.TEST_TOKEN_FAKE0;
  const targetUrl = process.env.SPRING_URL + "/api/user/detail";
  const response = await axios.get(targetUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": "en", // thêm dòng này
      // bạn có thể thêm header khác ở đây
    },
    params: { email }, // sẽ thành ?email=xxx
    timeout: 10_000,
  });
  return response.data.data;
};
module.exports = getFullUserInfor;
