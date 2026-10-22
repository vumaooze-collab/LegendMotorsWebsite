FROM gcc:14 AS build
WORKDIR /src
COPY login_risk.cpp .
RUN g++ -std=c++17 -O2 -Wall -Wextra -o /login-risk login_risk.cpp

FROM debian:bookworm-slim
COPY --from=build /login-risk /usr/local/bin/login-risk
CMD ["sleep", "infinity"]
