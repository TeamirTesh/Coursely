FROM public.ecr.aws/lambda/python:3.11

# Copy scraper and db modules into the container
COPY scraper/ ${LAMBDA_TASK_ROOT}/scraper/
COPY db/      ${LAMBDA_TASK_ROOT}/db/

# Install dependencies
COPY lambda/requirements.txt ${LAMBDA_TASK_ROOT}/requirements.txt
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Lambda handler: backend/lambda/handler.py → handler function
COPY lambda/handler.py ${LAMBDA_TASK_ROOT}/handler.py

CMD ["handler.handler"]
