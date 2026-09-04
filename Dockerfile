FROM public.ecr.aws/lambda/python:3.11

# Copy dependency file
COPY requirements.txt ./

# Upgrade pip and install pre-built wheels
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel && \
    pip3 install --no-cache-dir -r requirements.txt

# Copy application files
COPY ml_models.py engine.py ./

# Set the Lambda handler
CMD [ "engine.handler" ]
