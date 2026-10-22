FROM gcc:14 AS cpp-build
WORKDIR /src
COPY cpp/login_risk.cpp ./login_risk.cpp
RUN g++ -std=c++17 -O2 -Wall -Wextra -o /login-risk login_risk.cpp

FROM python:3.12-slim
WORKDIR /app
COPY python/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY python/main.py ./main.py
COPY --from=cpp-build /login-risk /usr/local/bin/login-risk
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
