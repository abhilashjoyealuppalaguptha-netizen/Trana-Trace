module trana_fsm (
    input  wire       clk,
    input  wire       rst,
    input  wire [1:0] click_count,
    input  wire       click_valid,
    input  wire       batt_low,
    output reg  [1:0] fsm_state
);

localparam NORMAL    = 2'd0;
localparam FAKE_OFF  = 2'd1;
localparam EMERGENCY = 2'd2;
localparam REAL_OFF  = 2'd3;

always @(posedge clk or posedge rst) begin
    if (rst) begin
        fsm_state <= NORMAL;
    end else begin
        case (fsm_state)

            NORMAL: begin
                if (batt_low)
                    fsm_state <= EMERGENCY;
                else if (click_valid) begin
                    if (click_count == 2'd1)
                        fsm_state <= FAKE_OFF;
                    else if (click_count == 2'd2)
                        fsm_state <= REAL_OFF;
                end
            end

            FAKE_OFF: begin
                if (batt_low)
                    fsm_state <= EMERGENCY;
                else if (click_valid) begin
                    if (click_count == 2'd3)
                        fsm_state <= NORMAL;
                    else if (click_count == 2'd2)
                        fsm_state <= REAL_OFF;
                end
            end

            EMERGENCY: begin
                // stays in emergency — reset to exit
            end

            REAL_OFF: begin
                if(click_valid)
                     fsm_state <= NORMAL;
            end

        endcase
    end
end

endmodule