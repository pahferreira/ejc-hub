#!/usr/bin/env bash
#
# Run a shell command on the prod EC2 instance via SSM Run Command, stream the
# output back into the Actions log, and exit non-zero if the command failed.
#
# Usage: ssm-run.sh <instance-id> <command string>
#
# The command string is executed by AWS-RunShellScript on the instance. We wait
# for a terminal state, print stdout/stderr, then gate the job on the result.
set -euo pipefail

INSTANCE_ID="$1"
shift
CMD="$*"

echo "::group::SSM send-command"
echo "instance: $INSTANCE_ID"
echo "command : $CMD"

# Build the parameters JSON safely (handles &&, spaces, etc.) with jq.
PARAMS=$(jq -n --arg cmd "$CMD" '{commands: [$cmd]}')

CMD_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "GitHub Actions deploy" \
  --parameters "$PARAMS" \
  --query "Command.CommandId" \
  --output text)
echo "CommandId: $CMD_ID"
echo "::endgroup::"

# `wait command-executed` returns non-zero when the invocation fails; we handle
# the status explicitly below so swallow its exit code here.
aws ssm wait command-executed \
  --command-id "$CMD_ID" \
  --instance-id "$INSTANCE_ID" || true

STATUS=$(aws ssm get-command-invocation \
  --command-id "$CMD_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "Status" --output text)

echo "::group::SSM stdout"
aws ssm get-command-invocation \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" --output text || true
echo "::endgroup::"

echo "::group::SSM stderr"
aws ssm get-command-invocation \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
  --query "StandardErrorContent" --output text || true
echo "::endgroup::"

echo "SSM command status: $STATUS"
[ "$STATUS" = "Success" ]
