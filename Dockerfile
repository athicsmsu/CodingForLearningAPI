# ใช้ Node.js base image
FROM node:20.10.0

# ติดตั้ง OpenJDK (Java Development Kit) และ Python
RUN apt-get update && apt-get install -y \
    openjdk-11-jdk \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ตั้งค่า symbolic link สำหรับ Python
RUN ln -s /usr/bin/python3 /usr/bin/python

# ตั้งค่า JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json เพื่อจัดการ dependencies
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมดลงใน container
COPY . .

# เปิดพอร์ตสำหรับเซิร์ฟเวอร์
EXPOSE 3000

# คำสั่งสำหรับรันเซิร์ฟเวอร์
CMD ["npm", "start"]